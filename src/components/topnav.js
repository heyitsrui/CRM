
const TopNav = () => {
  return (
    <header className="top-nav">
      <div className="user-profile">
        <div className="user-info">
          <span className="user-name">Userr</span>
          <span className="user-email">Email</span>
        </div>
        <div className="user-avatar">
          {/* Replace with your image */}
          <img src="/avatar-placeholder.png" alt="User" />
        </div>
      </div>
    </header>
  );
};

export default TopNav;