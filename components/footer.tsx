const Footer = () => {
  return (
    <footer className="bg-orange-900 text-orange-100 py-8 px-6 shadow-inner">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold text-orange-200" style={{ fontFamily: 'Creepster, cursive' }}>halloweencostu.me</h2>
            <p className="mt-2 text-sm">Generate spooky costumes with AI</p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-orange-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-orange-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-orange-300 transition-colors">Contact</a>
          </div>
        </div>
        <div className="mt-8 text-center text-sm">
          © {new Date().getFullYear()} halloweencostu.me. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;