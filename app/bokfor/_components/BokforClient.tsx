"use client";

import { BokforStoreProvider } from "../_stores/BokforStoreProvider";
import SökFörval from "./SokForval";
import Steg2 from "./Steg/Steg2";
import Steg2Levfakt from "./Steg/Steg2Levfakt";
import Steg3 from "./Steg/Steg3";
import Steg4 from "./Steg/Steg4";

interface BokforClientProps {
  initialData: {
    favoritFörval: any[];
    allaFörval: any[];
    bokföringsmetod: string;
    anställda: any[];
  };
}

export default function BokforClient({ initialData }: BokforClientProps) {
  return (
    <BokforStoreProvider initialData={initialData}>
      <SökFörval />
      <Steg2 />
      <Steg2Levfakt />
      <Steg3 />
      <Steg4 />
    </BokforStoreProvider>
  );
}
