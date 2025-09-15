import MainLayout from "../_components/MainLayout";
import SökFörval from "./_components/SokForval";
import Steg2 from "./_components/Steg/Steg2";
import Steg2Levfakt from "./_components/Steg/Steg2Levfakt";
import Steg3 from "./_components/Steg/Steg3";
import Steg4 from "./_components/Steg/Steg4";

export default function BokforPage() {
  return (
    <MainLayout>
      <SökFörval />
      <Steg2 />
      <Steg2Levfakt />
      <Steg3 />
      <Steg4 />
    </MainLayout>
  );
}
