import {
  Breadcrumb as BreadcrumbBase,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/web/components/ui/breadcrumb";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/web/components/ui/hover-card";
import { Fragment } from "react/jsx-runtime";

interface BreadcrumbProps {
  fileName: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ fileName }) => (
  <HoverCard>
    <HoverCardTrigger>
      <BreadcrumbBase>
        <BreadcrumbList key="list">
          {fileName.split("\\").map((part, index, arr) => {
            // show first two parts and last two parts, between them show ellipsis
            if (arr.length < 4) {
              return (
                <Fragment key={`fragment-${index}`}>
                  <BreadcrumbItem key={`item-${index}`}>
                    <BreadcrumbLink>{part}</BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < arr.length - 1 && (
                    <BreadcrumbSeparator key={`separator-${index}`} />
                  )}
                </Fragment>
              );
            } else if (index < 2 || index > arr.length - 3) {
              return (
                <Fragment key={`fragment-${index}`}>
                  <BreadcrumbItem key={`item-${index}`}>
                    <BreadcrumbLink>{part}</BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < arr.length - 1 && (
                    <BreadcrumbSeparator key={`separator-${index}`} />
                  )}
                </Fragment>
              );
            } else if (index === 2) {
              return (
                <Fragment key={`fragment-${index}`}>
                  <BreadcrumbEllipsis key={`item-${index}`} />
                  <BreadcrumbSeparator key={`separator-${index}`} />
                </Fragment>
              );
            }
          })}
        </BreadcrumbList>
      </BreadcrumbBase>
    </HoverCardTrigger>
    <HoverCardContent className="w-full text-white">
      {fileName}
    </HoverCardContent>
  </HoverCard>
);

export default Breadcrumb;
