import WelcomeHeader from "../../components/welcome/WelcomeHeader/WelcomeHeader";
import Hero from "../../components/welcome/Hero/Hero";
import HowItWorks from "../../components/welcome/HowItWorks/HowItWorks";
import WhatWeDo from "../../components/welcome/WhatWeDo/WhatWeDo";
import CTABanner from "../../components/welcome/ContactForm/ContactForm";
import WelcomeFooter from "../../components/welcome/WelcomeFooter/WelcomeFooter";
import WhatsAppFloat from "../../components/welcome/WhatsAppFloat/WhatsAppFloat";
import styles from "./Welcome.module.css";

export default function Welcome() {
  return (
    <div className={styles.welcomeContainer}>
      <WelcomeHeader />
      <main className={styles.mainContent}>
        <Hero />
        <HowItWorks />
        <WhatWeDo />
        <CTABanner />
        <WhatsAppFloat />
      </main>
      <WelcomeFooter />
    </div>
  );
}