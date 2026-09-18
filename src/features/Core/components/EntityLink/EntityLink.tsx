import { FC } from "react";
import { getUrlAndOrg } from "@/features/Core/utils/entityLinks";
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';

interface EntityLinkProps {
  id: string;
  linkTextGenerator: (org: string | null) => string;
  useIcon?: boolean;
  fallbackText?: string;
  [key: string]: unknown;
}

const EntityLink: FC<EntityLinkProps> = ({id, linkTextGenerator, useIcon = false, fallbackText = "", ...props}) => {
  const [url, org] = getUrlAndOrg(id);
  const linkText = linkTextGenerator(org);

  if(url && linkText)
    return(
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        {...props}
        >{linkText}{useIcon && <ExternalLink/>}
      </a>
    );

  return (
    <span {...props}>
      {fallbackText}
    </span>
  );
}

export default EntityLink;