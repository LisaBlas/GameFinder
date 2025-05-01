import React from 'react';
import { Link } from 'wouter';
import { Linkedin, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-800 border-t border-slate-700 py-6 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <p className="text-sm text-slate-400">
              &copy; {currentYear} GameFinder. Using IGDB API. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-slate-400 hover:text-white transition-colors duration-200">
              <Linkedin className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-slate-400 hover:text-white transition-colors duration-200">
              <Twitter className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-slate-400 hover:text-white transition-colors duration-200">
              <Instagram className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-slate-400 hover:text-white transition-colors duration-200">
              <Youtube className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
