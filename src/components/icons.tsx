import React from "react";

/**
 * Material Symbols Rounded — el mismo set de íconos que usa el portal real
 * de estudiantes de Icesi (viewBox "0 -960 960 960", filled/currentColor).
 * Cada componente exportado aquí tiene el MISMO NOMBRE que su equivalente
 * de lucide-react, así que reemplazar un import de "lucide-react" por
 * "@/components/icons" no requiere tocar ningún JSX de uso — solo la línea
 * de import (className, tamaño via las clases h-N / w-N, color via text-N
 * siguen funcionando igual).
 */

// Tailwind's spacing scale (rem * 16), covering every h-*/w-* value used en la app.
const TAILWIND_PX: Record<string, number> = {
  "1": 4,
  "1.5": 6,
  "2": 8,
  "2.5": 10,
  "3": 12,
  "3.5": 14,
  "4": 16,
  "5": 20,
  "6": 24,
  "7": 28,
  "8": 32,
  "9": 36,
  "10": 40,
  "11": 44,
  "12": 48,
};

function extractSize(className?: string): number {
  if (!className) return 16;
  const match = className.match(/(?:^|\s)h-([\d.]+)(?:\s|$)/);
  if (match) {
    const key = match[1];
    if (TAILWIND_PX[key] !== undefined) return TAILWIND_PX[key];
    const v = parseFloat(key);
    if (!Number.isNaN(v)) return v * 4;
  }
  return 16;
}

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

function makeIcon(glyph: string, fill = true) {
  const IconComponent = ({ className, style }: IconProps) => {
    const size = extractSize(className);
    return (
      <span
        aria-hidden="true"
        translate="no"
        className={[
          "material-symbols-rounded",
          "inline-block",
          "shrink-0",
          "align-middle",
          "leading-none",
          "select-none",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          fontSize: size,
          width: size,
          height: size,
          fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 500, 'GRAD' 0, 'opsz' ${size}`,
          ...style,
        }}
      >
        {glyph}
      </span>
    );
  };
  IconComponent.displayName = glyph;
  return IconComponent;
}

export const AlertCircle = makeIcon("error");
export const ArrowLeft = makeIcon("arrow_back");
export const ArrowLeftRight = makeIcon("swap_horiz");
export const ArrowRight = makeIcon("arrow_forward");
export const ArrowUpRight = makeIcon("north_east");
export const Bell = makeIcon("notifications");
export const Briefcase = makeIcon("work");
export const Building = makeIcon("domain");
export const Building2 = makeIcon("corporate_fare");
export const Calculator = makeIcon("calculate");
export const Calendar = makeIcon("calendar_month");
export const Check = makeIcon("check");
export const CheckCircle = makeIcon("check_circle");
export const CheckCircle2 = makeIcon("check_circle");
export const ChevronDown = makeIcon("expand_more");
export const ChevronLeft = makeIcon("chevron_left");
export const ChevronRight = makeIcon("chevron_right");
export const ChevronUp = makeIcon("expand_less");
export const Circle = makeIcon("circle", true);
export const ClipboardList = makeIcon("assignment");
export const Clock = makeIcon("schedule");
export const DollarSign = makeIcon("attach_money");
export const Dot = makeIcon("fiber_manual_record", true);
export const Download = makeIcon("download");
export const Edit3 = makeIcon("edit");
export const ExternalLink = makeIcon("open_in_new");
export const Eye = makeIcon("visibility");
export const EyeOff = makeIcon("visibility_off");
export const FileSpreadsheet = makeIcon("table_chart");
export const FileText = makeIcon("description");
export const FileType = makeIcon("draft");
export const Filter = makeIcon("filter_list");
export const FlaskConical = makeIcon("science");
export const GraduationCap = makeIcon("school");
export const GripVertical = makeIcon("drag_indicator");
export const HelpCircle = makeIcon("help");
export const History = makeIcon("history");
export const Home = makeIcon("home");
export const Info = makeIcon("info");
export const Layers = makeIcon("layers");
export const LayoutGrid = makeIcon("grid_view");
export const List = makeIcon("list");
export const ListChecks = makeIcon("checklist");
export const Lock = makeIcon("lock");
export const LogOut = makeIcon("logout");
export const Mail = makeIcon("mail");
export const MapPin = makeIcon("location_on");
export const Menu = makeIcon("menu");
export const MessageSquare = makeIcon("chat");
export const Moon = makeIcon("dark_mode");
export const MoreHorizontal = makeIcon("more_horiz");
export const Network = makeIcon("hub");
export const PanelLeft = makeIcon("view_sidebar");
export const Percent = makeIcon("percent");
export const Phone = makeIcon("call");
export const Plus = makeIcon("add");
export const PlusCircle = makeIcon("add_circle");
export const Printer = makeIcon("print");
export const Rocket = makeIcon("rocket_launch");
export const RotateCcw = makeIcon("restart_alt");
export const Save = makeIcon("save");
export const Search = makeIcon("search");
export const Send = makeIcon("send");
export const ShieldCheck = makeIcon("verified_user");
export const SlidersHorizontal = makeIcon("tune");
export const Sparkles = makeIcon("auto_awesome");
export const Sun = makeIcon("light_mode");
export const Tag = makeIcon("sell");
export const Trash2 = makeIcon("delete");
export const TrendingUp = makeIcon("trending_up");
export const UploadCloud = makeIcon("cloud_upload");
export const User = makeIcon("person");
export const UserCheck = makeIcon("person_check");
export const UserPlus = makeIcon("person_add");
export const Users = makeIcon("group");
export const X = makeIcon("close");
