const Footer = () => {
  return (
    <footer className="mt-auto py-6 bg-sage-100">
      <div className="container mx-auto px-4">
        <div className="text-center text-sage-900 space-y-2">
          <p className="text-sm">Copyright © 2025, Tutaville</p>
          <p className="text-xs">
            Powered By{" "}
            <a 
              href="https://www.lesedi.agency/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sage-600 hover:text-sage-900 transition-colors"
            >
              Lesedi Agency Innovations
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;