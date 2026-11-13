export type NavLink = {
  label: string;
  href: string;
};

export type ImageContent = {
  src: string;
  alt?: string;
  title?: string;
  scale?: number;
};

export type ClientLogo =
  | {
      type: "image";
      src: string;
      alt: string;
      width: number;
      height: number;
    }
  | { type: "text"; label: string }
  | { type: "slashes"; label?: string }
  | { type: "circles"; label: string };

export type Project = {
  id: string;
  title: string;
  href?: string;
  services: string;
  year: string;
  client: string;
  role: string;
  summary: string;
  overview: string;
  image: string;
  gallery: string[];
  className: string;
};

export type SiteContent = {
  seo: {
    siteUrl: string;
    title: string;
    description: string;
    image: string;
    imageAlt: string;
    icon: string;
  };
  navigation: {
    brand: string;
    centerLinks: NavLink[];
    talkLink: NavLink;
  };
  hero: {
    firstName: string;
    lastName: string;
    description: string;
    location: string;
    useProjectImages: boolean;
    extraHoverImages: string[];
  };
  music: {
    audioSrc: string;
    coverSrc: string;
    playLabel: string;
    pauseLabel: string;
  };
  worksPage: {
    title: string;
    description: string;
  };
  projectDetail: {
    eyebrow: string;
    overviewLabel: string;
    nextLabel: string;
    details: {
      year: string;
      client: string;
      role: string;
      services: string;
    };
  };
  home: {
    about: {
      title: string;
      paragraphs: string[];
      images: Array<ImageContent & { frameClassName: string }>;
      experienceLabels: {
        company: string;
        role: string;
        year: string;
      };
      experiences: Array<{
        company: string;
        role: string;
        year: string;
      }>;
    };
    services: {
      showcaseImage: ImageContent;
      title: string;
      description: string;
      mockupImage: ImageContent;
      items: Array<{
        title: string;
        description: string;
        deliverables: string[];
      }>;
    };
    testimonials: {
      title: string;
      description: string;
      items: Array<{
        name: string;
        role: string;
        avatar: string;
        quote: string;
      }>;
    };
    clients: {
      title: string;
      items: ClientLogo[];
    };
    closingImage: ImageContent;
    finalImage: ImageContent;
    letsChat: {
      label: string;
      titleLines: string[];
      buttonLabel: string;
      href: string;
    };
    allWorkLink: {
      title: string;
      href: string;
      image: {
        title: string;
        src: string;
      };
    };
  };
  contact: {
    title: string;
    email: string;
    phone: string;
    whatsappHref: string;
    copyButton: string;
    copiedLabel: string;
    callLabel: string;
    phoneLabel: string;
    whatsappLabel: string;
    whatsappText: string;
    note: string;
  };
  footer: {
    ticker: string;
    description: string;
    links: NavLink[];
  };
  projects: Project[];
  photoGallery: {
    title: string;
    description: string;
    items: Array<{
      image: string;
      text?: string;
      description?: string;
    }>;
  };
};
