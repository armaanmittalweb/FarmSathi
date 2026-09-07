"""
Trains the crop-disease classifier that ai-service/vision.py serves.

This is the script form of notebooks/crop-disease-prediction-model.ipynb,
which trained successfully (~88% val accuracy on 15 PlantVillage classes)
but whose final `model.save(...)` cell errored out on a later re-run,
leaving Crop_Disease_Prediction_Model.h5 an empty ~800-byte stub. This
script fixes that: it saves the model AND a class_names.json (needed to
map predictions back to human-readable labels, since a plain .h5 doesn't
store class order) in one uninterrupted run.

Dataset: PlantVillage, Pepper/Potato/Tomato subset (15 classes, ~22.8k
images) already included at plantvillage_repo/raw/color/ — one subfolder
per class, e.g.:
    plantvillage_repo/raw/color/Tomato___healthy/*.JPG
    plantvillage_repo/raw/color/Tomato___Late_blight/*.JPG
    ...
No download needed. (See ai-models/README.md for how this was fetched —
via a sparse git checkout of github.com/spMohanty/PlantVillage-Dataset —
if you ever need to refresh or extend it.)

Usage:
    python train_disease_model.py                       # uses the bundled dataset
    python train_disease_model.py --data_dir other/dir   # or point at your own
"""

import argparse
import json
from pathlib import Path

import tensorflow as tf
from tensorflow.keras import layers

BASE_DIR = Path(__file__).resolve().parent
OUT_DIR = BASE_DIR / "Crop_Disease_Prediction_Model"
DEFAULT_DATA_DIR = BASE_DIR / "plantvillage_repo" / "raw" / "color"


def build_model(img_size, num_classes):
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=img_size + (3,), include_top=False, weights="imagenet"
    )
    base_model.trainable = False  # transfer learning: freeze the pretrained backbone

    inputs = tf.keras.Input(shape=img_size + (3,))
    x = layers.Rescaling(1.0 / 255)(inputs)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = tf.keras.Model(inputs, outputs)
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    return model


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", default=str(DEFAULT_DATA_DIR), help="Directory of one subfolder per class")
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--img_size", type=int, default=224)
    args = parser.parse_args()

    img_size = (args.img_size, args.img_size)

    train_ds = tf.keras.preprocessing.image_dataset_from_directory(
        args.data_dir, validation_split=0.2, subset="training", seed=42,
        image_size=img_size, batch_size=args.batch_size,
    )
    val_ds = tf.keras.preprocessing.image_dataset_from_directory(
        args.data_dir, validation_split=0.2, subset="validation", seed=42,
        image_size=img_size, batch_size=args.batch_size,
    )

    class_names = train_ds.class_names
    print("Classes:", class_names)

    data_augmentation = tf.keras.Sequential(
        [layers.RandomFlip("horizontal"), layers.RandomRotation(0.1), layers.RandomZoom(0.1)]
    )
    train_ds = train_ds.map(lambda x, y: (data_augmentation(x, training=True), y))

    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=autotune)
    val_ds = val_ds.cache().prefetch(buffer_size=autotune)

    model = build_model(img_size, len(class_names))
    model.summary()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    checkpoint_path = OUT_DIR / "checkpoint.keras"
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(str(checkpoint_path), save_best_only=True, monitor="val_accuracy"),
        tf.keras.callbacks.EarlyStopping(patience=4, restore_best_weights=True, monitor="val_accuracy"),
    ]

    model.fit(train_ds, validation_data=val_ds, epochs=args.epochs, callbacks=callbacks)

    # Evaluate once, on the same run's val_ds (fixes the notebook's bug of
    # referencing val_ds in a later, disconnected cell execution).
    loss, accuracy = model.evaluate(val_ds)
    print(f"Final validation accuracy: {accuracy:.4f} (loss {loss:.4f})")

    model_path = OUT_DIR / "Crop_Disease_Prediction_Model.h5"
    model.save(model_path)
    with open(OUT_DIR / "class_names.json", "w") as f:
        json.dump(class_names, f, indent=2)

    print(f"Saved model to {model_path}")
    print(f"Saved class names to {OUT_DIR / 'class_names.json'}")


if __name__ == "__main__":
    main()
