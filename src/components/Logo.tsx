import config, { APP_TYPE } from "@/config";
import React from "react";
import { Link } from "react-router-dom";

const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <Link to="/" className={`flex items-center ${className}`}>
      {APP_TYPE === "fleet" && (
        <div className="h-16 flex items-center justify-center">
          <img
            src={config.logo}
            alt={config.title}
            className="h-full object-contain"
          />
        </div>
      )}
      {APP_TYPE === "booba" && (
        <div className="h-16 py-2 flex items-center justify-center">
          <img
            src={config.logo}
            alt={config.title}
            className="h-full rounded"
          />
          <img
            src={config.logoOnlyText}
            alt={config.title}
            className="h-full object-contain rounded ml-2"
          />
        </div>
      )}
    </Link>
  );
};

export default Logo;
