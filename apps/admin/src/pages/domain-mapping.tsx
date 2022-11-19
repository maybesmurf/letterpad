import { Alert, PageHeader } from "antd";
import { Content } from "antd/lib/layout/layout";
import Head from "next/head";

import { NewDomain } from "@/components/domain/new-domain";
import Loading from "@/components/loading";

import { useDomainQuery } from "@/__generated__/queries/queries.graphql";

interface Props {
  readOnly: boolean;
}

const DomainMapping: React.FC<Props> = () => {
  const { data, loading } = useDomainQuery();
  return (
    <>
      <Head>
        <title>Domain Mapping</title>
      </Head>
      <PageHeader className="site-page-header" title="Domain Mapping">
        <span className="help-text">
          Link your custom domain with Letterpad
        </span>
      </PageHeader>

      <Content>
        <div className="site-layout-background" style={{ padding: 24 }}>
          {loading && <Loading />}
          {data?.domain.__typename === "DomainNotFound" && <NewDomain />}
          {data?.domain.__typename === "Domain" && (
            <NewDomain {...data.domain} />
          )}
        </div>
      </Content>
    </>
  );
};

export default DomainMapping;
