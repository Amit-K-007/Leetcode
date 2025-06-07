import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

type Language = "cpp" | "python" | "java";

export function LangSelector() {
  const [language, setLanguage] = useState<Language>("cpp");

  return (
    <Select
      value={language}
      onValueChange={(val) => setLanguage(val as Language)}
    >
      <SelectTrigger className="w-[100px] hover:bg-zinc-100 border-zinc-300 focus-visible:ring-0 focus-visible:border-zinc-300 focus:outline-none">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="cpp">C++</SelectItem>
        <SelectItem value="python">Python</SelectItem>
        <SelectItem value="java">Java</SelectItem>
      </SelectContent>
    </Select>
  );
}
