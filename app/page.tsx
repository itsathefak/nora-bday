"use client";

import { useState } from "react";
import { IntroVideo } from "../components/IntroVideo";
import { WelcomeScreen } from "../components/WelcomeScreen";
import { ProfileSelection } from "../components/ProfileSelection";

type LandingStep = "intro" | "welcome" | "profiles";

export default function HomePage() {
  const [step, setStep] = useState<LandingStep>("intro");

  return (
    <>
      {step === "intro" && <IntroVideo onComplete={() => setStep("welcome")} />}

      {step === "welcome" && (
        <WelcomeScreen onGetStarted={() => setStep("profiles")} />
      )}

      {step === "profiles" && <ProfileSelection />}
    </>
  );
}
