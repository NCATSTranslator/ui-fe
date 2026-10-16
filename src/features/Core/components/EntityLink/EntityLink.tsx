import { FC } from "react";
import { getUrlAndOrg } from "@/features/Core/utils/entityLinks";

interface EntityLinkProps {
  id: string;
  linkTextGenerator: (org: string | null) => string;
  fallbackText?: string;
  [key: string]: unknown;
}

const EntityLink: FC<EntityLinkProps> = ({id, linkTextGenerator, fallbackText = "", ...props}) => {
  const [url, org] = getUrlAndOrg(id);
  const linkText = linkTextGenerator(org);

  if(url && linkText)
    return(
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        {...props}
        >{linkText}
      </a>
    );

  return (
    <span {...props}>
      {fallbackText}
    </span>
  );
}

export default EntityLink;