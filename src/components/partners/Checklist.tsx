import { CheckCircle2, XCircle } from "lucide-react";

export const Checklist: React.FC = () => {
  const CHECKLIST = [
    {
      check: true,
      label: "Modern vehicles",
      description:
        "Not older than 7 years for standard classes and 5 years for premium and business classes",
    },
    {
      check: false,
      label: "Visual noise",
      description: "Stickers or visual inscription on the vehicle bodies",
    },
    {
      check: true,
      label: "Maintenance of your car",
      description: "Regular maintenance checks",
    },
    {
      check: false,
      label: "Old vehicles",
      description: "Stickers or visual inscription on the vehicle bodies",
    },
    {
      check: true,
      label: "Official registration",
      description: "License to provide transfer services",
    },
    {
      check: false,
      label: "Lack of registration",
      description: "No legal approve for the service activity",
    },
  ];

  return (
    <section className="py-12 bg-muted/40 sm:py-16 lg:py-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl xl:text-5xl">
          Check your vehicles <br />
          using our checklist
        </h2>

        <div className="max-w-4xl mx-auto">
          <ul className="space-y-4 grid grid-cols-1 gap-y-10 gap-x-12 mt-12 sm:grid-cols-2">
            {CHECKLIST.map((item, index) => (
              <li key={index} className="flex items-start">
                {item.check ? (
                  <CheckCircle2 className="size-12 text-green-500 mr-3 flex-shrink-0 mt-1" />
                ) : (
                  <XCircle className="size-12 text-red-500 mr-3 flex-shrink-0 mt-1" />
                )}
                <div className="text-left">
                  <h4 className="text-2xl">{item.label}</h4>
                  <span className="text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
