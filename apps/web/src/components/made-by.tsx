export function MadeBy() {
  return (
    <a
      className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 transition-colors hover:bg-muted"
      href="https://github.com/imjac0b/sonar"
      rel="noreferrer"
      target="_blank"
    >
      <span className="text-muted-foreground text-xs">Made by</span>
      <div className="flex items-center gap-1.5">
        <img
          alt="Jacob"
          className="h-5 w-5 rounded-full"
          height={20}
          src="https://avatars.githubusercontent.com/u/186802484"
          width={20}
        />
        <span className="font-medium text-xs">Jacob</span>
      </div>
    </a>
  );
}
