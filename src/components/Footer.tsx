import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { useTranslation } from '@/contexts/TranslationContext';

const Footer = () => {
  const { translate } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white text-black pt-12 pb-8 shadow-md">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo />
            <p className="mt-4">
              {translate('footer.description')}
            </p>
          </div>
          
          <div>
            <h5 className="text-lg font-bold mb-4">{translate('footer.quick_links')}</h5>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-fleet-red">{translate('nav.home')}</Link></li>
              <li><button className="hover:text-fleet-red">{translate('nav.book_chauffeur')}</button></li>
              <li><button className="hover:text-fleet-red">{translate('nav.hourly')}</button></li>
              <li><Link to="/about" className="hover:text-fleet-red">{translate('footer.about_us')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h5 className="text-lg font-bold mb-4">{translate('footer.support')}</h5>
            <ul className="space-y-2">
              <li><Link to="/faq" className="hover:text-fleet-red">{translate('nav.faq')}</Link></li>
              <li><Link to="/contact" className="hover:text-fleet-red">{translate('nav.contact')}</Link></li>
              <li><Link to="/terms" className="hover:text-fleet-red">{translate('footer.terms')}</Link></li>
              <li><Link to="/privacy" className="hover:text-fleet-red">{translate('footer.privacy')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h5 className="text-lg font-bold mb-4">{translate('footer.contact')}</h5>
            <address className="not-italic space-y-2">
              <p>{translate('footer.address_line1')}</p>
              <p>{translate('footer.address_line2')}</p>
              <p>{translate('footer.phone')}</p>
              <p>{translate('footer.email')}</p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-gray-600">
          <p>{translate('footer.copyright').replace('{year}', currentYear.toString())} <a href="https://jezx.in" target="_blank" rel="noopener noreferrer" className="text-fleet-red hover:underline">JezX</a></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
