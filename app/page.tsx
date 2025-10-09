import Startsidan from "./(publikt)/Startsidan";

export default function Page() {
  // Visa alltid landing page direkt för maximal hastighet
  // Inloggade användare navigerar till /start manuellt
  return <Startsidan />;
}
