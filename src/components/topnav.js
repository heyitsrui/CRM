const TopNav = ({ loggedInUser }) => {
  return (
    <header className="top-nav">
      <div className="user-profile">
        <div className="user-info">
          <span className="user-name">{loggedInUser?.name || "User"}</span>
          <span className="user-email">{loggedInUser?.email || "Email"}</span>
        </div>
        <div className="user-avatar">
          <img
            src="/avatar-placeholder.png"
            alt={loggedInUser?.name || "User"}
          />
        </div>
      </div>
    </header>
  );
};

export default TopNav;
