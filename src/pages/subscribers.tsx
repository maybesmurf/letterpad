import { PostTypes } from "@/__generated__/__types__";
import { Layout, Table } from "antd";
import CustomLayout from "@/components/layouts/Layout";
import withAuthCheck from "../hoc/withAuth";
import ErrorMessage from "@/components/ErrorMessage";
import Head from "next/head";
import { Header } from "@/components/posts/header";
import { useSubscribersQuery } from "@/graphql/queries/queries.graphql";

const { Content } = Layout;

export const columns = [
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
  },
  {
    title: "Verified",
    dataIndex: "verified",
    key: "verified",
    render: (verified: boolean) => {
      return <>{verified ? "Verified" : "Not Verified"}</>;
    },
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (date: string) => {
      let d = new Date(date);
      let ye = new Intl.DateTimeFormat("en", { year: "2-digit" }).format(d);
      let mo = new Intl.DateTimeFormat("en", { month: "short" }).format(d);
      let da = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(d);

      return (
        <span>
          {da} {mo}, {ye}
        </span>
      );
    },
  },
];

function Subscribers() {
  const { loading, data, error } = useSubscribersQuery();

  if (error) return <ErrorMessage description={error} title="Error" />;

  return (
    <>
      <Head>
        <title>Subscribers</title>
      </Head>
      <Header type={PostTypes.Post} title="Subscribers">
        Here you will find all the users subscribed to your blog.
      </Header>
      <Content>
        <div className="site-layout-background" style={{ padding: 16 }}>
          <Table
            columns={columns}
            dataSource={data?.subscribers.rows}
            loading={loading}
            pagination={false}
          />
        </div>
      </Content>
    </>
  );
}

const SubscribersWithAuth = withAuthCheck(Subscribers);
SubscribersWithAuth.layout = CustomLayout;
export default SubscribersWithAuth;
