interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  name?: string;
}

const SIZE_STYLES = {
  sm: { track: "h-5 w-9", thumb: "h-4 w-4", translate: "translate-x-4" },
  md: { track: "h-6 w-11", thumb: "h-5 w-5", translate: "translate-x-5" },
};

const CustomToggle = ({
  checked,
  onChange,
  disabled = false,
  size = "md",
  name,
}: ToggleSwitchProps) => {
  const styles = SIZE_STYLES[size];

  return (
    <button
      type="button"
      role="switch"
      name={name}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative ${styles.track} shrink-0 rounded-full transition ${
        checked ? "bg-blue-600" : "bg-slate-200"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 ${styles.thumb} rounded-full bg-white shadow transition ${
          checked ? styles.translate : "translate-x-0"
        }`}
      />
    </button>
  );
};

export default CustomToggle;