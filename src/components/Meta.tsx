import config from "@/config";
import React from "react";
import { Helmet } from "react-helmet";

interface MetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
  location?: string;
}

/**
 * Meta component for SEO optimization
 * Allows setting title, description, and other meta tags for each page
 */
const Meta: React.FC<MetaProps> = ({
  title = `Premium Chauffeur & Luxury Car Service in ${config.country}`,
  description = `${config.title}  offers premium chauffeur services in Dubai, Abu Dhabi, and across UAE. Book professional drivers, luxury vehicles, and airport transfers. Available 24/7.`,
  keywords = "chauffeur service UAE, luxury car rental Dubai, professional drivers Abu Dhabi, airport transfer UAE, Dubai chauffeur, Abu Dhabi private driver",
  canonicalUrl,
  ogType = "website",
  ogImage = "/og-image.jpg",
  location = "Dubai, UAE",
}) => {
  const siteTitle = title
    ? `${title} |  ${config.title} `
    : `${config.title}  | Premium Chauffeur & Luxury Car Service in ${config.country}`;

  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Location specific */}
      <meta name="geo.placename" content={location} />
      <meta name="geo.region" content="AE" />
    </Helmet>
  );
};

export default Meta;
