import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { User, AlertCircle } from "lucide-react";
import { getProfile } from "../api/auth";
import { setProfile } from "../store/farmerSlice";
import Card from "../components/ui/Card";

export default function Profile() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((s) => s.farmer.profile);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProfile()
      .then((data) => dispatch(setProfile(data)))
      .catch((err) => setError(err.response?.data?.error || "Failed to load profile."));
  }, [dispatch]);

  const rows = profile
    ? [
        [t("auth.name"), profile.name],
        [t("auth.phone"), profile.phone],
        [t("auth.age"), profile.age],
        [t("auth.farmSize"), profile.farm_size],
        [t("auth.cropType"), profile.crop_type],
        [t("auth.state"), profile.location?.state],
        [t("auth.district"), profile.location?.district],
      ]
    : [];

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <div className="mb-6 flex flex-col items-center gap-2">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-100 text-moss-600">
          <User size={28} />
        </span>
        <h1 className="text-xl font-bold text-sand-900">{profile?.name || t("profile.title")}</h1>
      </div>

      {error && (
        <p className="flex items-start gap-2 text-sm font-medium text-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {profile && (
        <Card className="divide-y divide-sand-100 p-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between px-4 py-3 text-sm">
              <dt className="font-medium text-sand-500">{label}</dt>
              <dd className="text-sand-900">{value || "—"}</dd>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
