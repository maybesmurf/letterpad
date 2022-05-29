import React, { useCallback, useEffect, useRef, useState } from "react";

import { Media } from "@/__generated__/__types__";
import { MediaDocument } from "@/__generated__/queries/queries.graphql";
import { apolloBrowserClient } from "@/graphql/apolloBrowserClient";
import {
  MediaQuery,
  MediaQueryVariables,
} from "@/graphql/queries/queries.graphql";

import InfiniteScrollList from "../InfiniteScrollList";

interface IProps {
  renderer: (items: Media[]) => JSX.Element[];
}

const InternalMedia: React.FC<IProps> = ({ renderer }) => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Media[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const fetchInternalMedia = useCallback(
    async (page = 1) => {
      const result = await apolloBrowserClient.query<
        MediaQuery,
        MediaQueryVariables
      >({
        query: MediaDocument,
        variables: {
          filters: {
            page,
          },
        },
      });

      const images = {
        rows: result.data.media.rows,
        count: result.data.media.count,
      };
      if (mounted) {
        setData([...data, ...images.rows]);
        setTotalCount(images.count);
      }
    },
    [data],
  );

  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    fetchInternalMedia();

    return () => {
      mounted.current = false;
    };
  }, [fetchInternalMedia]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchInternalMedia(nextPage);
  };

  if (data.length === 0) {
    return <p>You do not have any images in your gallery.</p>;
  }

  const jsxElements = renderer(data);

  return (
    <div>
      <InfiniteScrollList
        data={jsxElements}
        count={totalCount}
        loadMore={loadMore}
      />
    </div>
  );
};

export default InternalMedia;
