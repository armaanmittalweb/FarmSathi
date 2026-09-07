import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Phone, ShieldCheck, Info } from "lucide-react";
import { requestOtp, verifyOtp } from "../api/auth";
import { loginSuccess } from "../store/authSlice";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Logo from "../components/Logo";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [phone, setPhone] = useState(location.state?.phone || "");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await requestOtp(phone);
      setOtpSent(true);
      setDevOtp(data.dev_otp || null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await verifyOtp(phone, otp);
      dispatch(loginSuccess(data));
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP.");
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
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-sand-900">{t("nav.login")}</h1>
          {/* Two-step progress: sets the expectation up front instead of
              the form silently morphing after submit. */}
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-6 rounded-full ${!otpSent ? "bg-moss-600" : "bg-moss-200"}`} />
            <span className={`h-1.5 w-6 rounded-full ${otpSent ? "bg-moss-600" : "bg-sand-200"}`} />
          </div>
        </div>

        <form onSubmit={otpSent ? handleVerify : handleRequestOtp} className="mt-6 space-y-4">
          <Input
            label={t("auth.phone")}
            icon={Phone}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={otpSent}
            required
          />

          {otpSent && (
            <div>
              <Input label={t("auth.otp")} icon={ShieldCheck} value={otp} onChange={(e) => setOtp(e.target.value)} required inputMode="numeric" />
              {devOtp && (
                <p className="mt-2 flex items-start gap-2 rounded-xl bg-info/10 p-3 text-xs text-info">
                  <Info size={15} className="mt-0.5 shrink-0" />
                  <span>
                    {t("auth.devOtpHint")} <strong className="font-mono text-sm">{devOtp}</strong>
                  </span>
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm font-medium text-error">{error}</p>}

          <Button type="submit" disabled={submitting} full size="lg" className="mt-2">
            {otpSent ? t("auth.verify") : t("auth.requestOtp")}
          </Button>
        </form>
      </Card>

      <p className="mt-5 text-center text-sm text-sand-500">
        <Link to="/register" className="font-medium text-moss-700 hover:underline">
          {t("nav.register")}
        </Link>
      </p>
    </div>
  );
}
