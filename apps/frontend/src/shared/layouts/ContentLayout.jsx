const widthClassNames = {
  full: "max-w-none",
  profile: "max-w-5xl",
  form: "max-w-3xl",
};

const ContentLayout = ({ children, width = "full" }) => {
  return (
    <section className="flex w-full flex-1 flex-col px-6 py-6 text-[#F8FAFC]">
      <div
        className={[
          "flex w-full flex-col gap-6",
          widthClassNames[width] ?? widthClassNames.full,
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
};

export default ContentLayout;
