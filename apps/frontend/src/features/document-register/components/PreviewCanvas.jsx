const PreviewCanvas = ({ children, isPdf = false }) => {
  const overflowClassName = isPdf ? "overflow-hidden" : "overflow-auto";
  const contentClassName = isPdf
    ? "h-full min-h-0 min-w-0"
    : "min-h-full min-w-full p-3";

  return (
    <section
      className={[
        "h-full min-h-0 rounded-lg border border-[#123A5A] bg-[#031528]",
        overflowClassName,
      ].join(" ")}
    >
      <div className={contentClassName}>
        <div className={isPdf ? "h-full min-h-0 w-full" : "mx-auto w-fit max-w-none"}>
          {children}
        </div>
      </div>
    </section>
  );
};

export default PreviewCanvas;
