import StartClient from "./StartClient";
import { fetchRawYearData, checkWelcomeStatus, markWelcomeAsShown } from "./actions/actions";
import { processYearData } from "../_utils/format";

export default async function StartPage() {
  const currentYear = new Date().getFullYear().toString();

  const [rawData, shouldShowWelcome] = await Promise.all([
    fetchRawYearData(currentYear),
    checkWelcomeStatus(),
  ]);

  if (shouldShowWelcome) {
    await markWelcomeAsShown();
  }

  const processedData = processYearData(rawData);

  return (
    <StartClient
      initialData={processedData}
      initialYear={currentYear}
      showWelcome={shouldShowWelcome}
    />
  );
}
