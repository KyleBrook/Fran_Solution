import React from "react";

type SeoProps = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  twitterCard?: "summary" | "summary_large_image";
  themeColor?: string;
};

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const Seo: React.FC<SeoProps> = ({
  title,
  description,
  image,
  url,
  twitterCard = "summary_large_image",
  themeColor,
}) => {
  React.useEffect(() => {
    const currentUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    if (title) document.title = title;

    if (description) {
      setMeta("description", description);
      setProperty("og:description", description);
      setMeta("twitter:description", description);
    }
    if (title) {
      setProperty("og:title", title);
      setMeta("twitter:title", title);
    }
    if (image) {
      setProperty("og:image", image);
      setMeta("twitter:image", image);
    }
    if (currentUrl) {
      setProperty("og:url", currentUrl);
      setLink("canonical", currentUrl);
    }
    setProperty("og:type", "website");
    setMeta("twitter:card", twitterCard);

    if (themeColor) {
      setMeta("theme-color", themeColor);
    }
  }, [title, description, image, url, twitterCard, themeColor]);

  return null;
};

export default Seo;