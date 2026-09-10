export const roleColors = {
  farmer: {
    primary: "bg-green-700",
    dark: "bg-green-900",
    text: "text-green-700",
    border: "border-green-700",
    light: "bg-green-50",
  },
  processor: {
    primary: "bg-blue-700",
    dark: "bg-blue-900",
    text: "text-blue-700",
    border: "border-blue-700",
    light: "bg-blue-50",
  },
  consumer: {
    primary: "bg-purple-700",
    dark: "bg-purple-900",
    text: "text-purple-700",
    border: "border-purple-700",
    light: "bg-purple-50",
  },
} as const;

export type RoleColor = keyof typeof roleColors;
