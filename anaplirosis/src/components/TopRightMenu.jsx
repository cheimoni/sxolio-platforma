import React, { useState } from 'react';
import './TopRightMenu.css';

const TopRightMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDocumentsSubmenu, setShowDocumentsSubmenu] = useState(false);

  const menuItems = [
    {
      label: 'Αναπληρώσεις',
      url: 'http://evagorasev.fwh.is/index_menu.php'
    },
    {
      label: 'Διοίκηση',
      url: 'https://lasl-8511e.web.app/welcome.html'
    },
    {
      label: 'Προγραμματισμός',
      url: 'https://imerolokio-2025v2.web.app/'
    },
    {
      label: 'Έγγραφα Διοίκησης',
      hasSubmenu: true,
      documents: [
        {
          label: 'Β.Δ. Συντονιστές & Διοικητικοί',
          url: '/Β.Δ. Συντονιστές κλάδων και Διοικητικοί (1).html'
        },
        {
          label: 'Καθήκοντα ΒΔ Συγκεντρωτικά',
          url: '/Καθήκοντα ΒΔ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.html'
        },
        {
          label: 'Καθήκοντα ΒΔΑ Συγκεντρωτικά',
          url: '/Καθήκοντα ΒΔΑ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.html'
        },
        {
          label: 'Β.Δ.Α Υπεύθυνος ΔΔΚ',
          url: '/Β.Δ.Α Υπεύθυνος ΔΔΚ_καθήκοντα.html'
        },
        {
          label: 'Β.Δ.Α Υπεύθυνος Τομέα',
          url: '/Β.Δ.Α Υπεύθυνος Τομέα -  καθήκοντα.html'
        },
        {
          label: 'Ειδικά Καθήκοντα Β.Δ.Α & Β.Δ.',
          url: '/Ειδικά καθήκοντα και αρμοδιότητες Β.Δ.Α και Β.Δ. 30 Αυγούστου.html'
        },
        {
          label: 'Υπεύθυνοι Τμημάτων',
          url: '/ΥΠΕΥΘΥΝΟΙ ΤΜΗΜΑΤΩΝ ΚΑΙ Β.Δ. (3) (1).html'
        },
        {
          label: 'Ωράριο Λειτουργίας Σχολείου',
          url: '/ΩΡΑΡΙΟ ΛΕΙΤΟΥΡΓΙΑΣ ΤΟΥ  ΣΧΟΛΕΙΟΥ (3).html'
        }
      ]
    }
  ];

  return (
    <>
      {/* Αόρατη ζώνη hover στην ίδια θέση με το μενού */}
      <div
        className="menu-hover-zone"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      />
      
      {/* Μενού - εμφανίζεται μόνο όταν ο κέρσορας είναι πάνω */}
      {isOpen && (
        <div
          className="school-menu-dropdown"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="menu-items-container">
            {menuItems.map((item, index) => (
              <div
                key={index}
                className="menu-item-wrapper"
                onMouseEnter={() => item.hasSubmenu && setShowDocumentsSubmenu(true)}
                onMouseLeave={() => item.hasSubmenu && setShowDocumentsSubmenu(false)}
              >
                {item.hasSubmenu ? (
                  <>
                    <div className="school-menu-item submenu-trigger">
                      {item.label} ▶
                    </div>
                    {showDocumentsSubmenu && (
                      <div className="documents-submenu">
                        {item.documents.map((doc, docIndex) => (
                          <a
                            key={docIndex}
                            href={doc.url}
                            className="submenu-item"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {doc.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <a
                    href={item.url}
                    className="school-menu-item"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default TopRightMenu;
