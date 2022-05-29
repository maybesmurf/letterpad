const ProfileInfo = ({ name, avatar, site_url }) => {
  return (
    <>
      <div className="container">
        {avatar && (
          <img
            src={avatar}
            style={{ borderRadius: 50 }}
            alt={`avatar-${name}`}
          />
        )}
        <div className="flex">
          <span>{name}</span>
          <span>
            <a href={site_url} target="_blank" rel="noreferrer">
              View Site
            </a>
          </span>
        </div>
      </div>
      <style jsx>{`
        .flex {
          display: flex;
          flex-direction: column;
        }
        .container {
          display: flex;
          color: #fff;
          align-items: center;
          gap: 8px;
          bottom: 0px;
        }
        img {
          width: 40px;
          border-radius: 50%;
          border: 2px solid #4a4a5e;
        }
      `}</style>
    </>
  );
};

export default ProfileInfo;
