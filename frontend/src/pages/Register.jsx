import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserPlus } from "lucide-react";
import { register } from "../api/auth";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Logo from "../components/Logo";

const initialForm = { phone: "", name: "", language: "en", age: "", farm_size: "", crop_type: "", state: "", district: "" };

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        phone: form.phone,
        name: form.name || undefined,
        language: form.language,
        age: form.age ? Number(form.age) : undefined,
        farm_size: form.farm_size ? Number(form.farm_size) : undefined,
        crop_type: form.crop_type || undefined,
        location: { state: form.state || null, district: form.district || null },
      });
      navigate("/login", { state: { phone: form.phone } });
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <div className="mb-6 flex justify-center">
        <Logo withWordmark={false} className="[&_svg]:h-10 [&_svg]:w-10" />
      </div>

      <Card className="p-6 sm:p-8">
        <h1 className="text-xl font-bold text-sand-900">{t("nav.register")}</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input label={t("auth.phone")} name="phone" value={form.phone} onChange={handleChange} required type="tel" inputMode="tel" />
          <Input label={t("auth.name")} name="name" value={form.name} onChange={handleChange} />

          <div className="grid grid-cols-2 gap-4">
            <Input label={t("auth.age")} name="age" value={form.age} onChange={handleChange} type="number" min="0" />
            <Input label={t("auth.farmSize")} name="farm_size" value={form.farm_size} onChange={handleChange} type="number" min="0" step="any" />
          </div>

          <Input label={t("auth.cropType")} name="crop_type" value={form.crop_type} onChange={handleChange} />

          <div className="grid grid-cols-2 gap-4">
            <Input label={t("auth.state")} name="state" value={form.state} onChange={handleChange} />
            <Input label={t("auth.district")} name="district" value={form.district} onChange={handleChange} />
          </div>

          <Select label={t("auth.language")} name="language" value={form.language} onChange={handleChange}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="pa">ਪੰਜਾਬੀ</option>
          </Select>

          {error && <p className="text-sm font-medium text-error">{error}</p>}

          <Button type="submit" disabled={submitting} full size="lg" icon={UserPlus} className="mt-2">
            {t("auth.registerBtn")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
