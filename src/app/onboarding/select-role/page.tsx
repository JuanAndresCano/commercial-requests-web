"use client";

import dynamic from "next/dynamic";

const SelectRole = dynamic(() => import("@/views/SelectRole"), {
  ssr: false,
  loading: () => null,
});

export default function SelectRolePage() {
  return <SelectRole />;
}
