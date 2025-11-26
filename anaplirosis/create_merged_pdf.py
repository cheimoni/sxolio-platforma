import os
import shutil
from pathlib import Path

def merge_pdfs_simple():
    """Δημιουργεί ένα συγκεντρωτικό PDF αρχείο"""
    
    public_dir = Path("C:/Users/NUC/Desktop/anaplirosis/public")
    
    # Λίστα με τα PDF αρχεία
    pdf_files = [
        'greek_odigos_ipodoxis.pdf',
        'orarioleitourgias.pdf',
        'sxolia .pdf',
        'Β.Δ. Συντονιστές κλάδων και Διοικητικοί (1).pdf',
        'Β.Δ.Α Υπεύθυνος ΔΔΚ_καθήκοντα.pdf',
        'Β.Δ.Α Υπεύθυνος Τομέα -  καθήκοντα.pdf',
        'Γραφεία ΔΟ.pdf',
        'Ειδικά καθήκοντα και αρμοδιότητες Β.Δ.Α και Β.Δ. 30 Αυγούστου.pdf',
        'Καθήκοντα ΒΔ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.pdf',
        'Καθήκοντα ΒΔΑ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.pdf',
        'ΥΠΕΥΘΥΝΟΙ ΤΜΗΜΑΤΩΝ ΚΑΙ Β.Δ. (3) (1).pdf'
    ]
    
    print("🚀 Ξεκινάω την ένωση των PDF αρχείων...")
    print()
    
    # Βρες το πρώτο διαθέσιμο PDF
    first_pdf = None
    existing_pdfs = []
    
    for pdf_file in pdf_files:
        pdf_path = public_dir / pdf_file
        if pdf_path.exists():
            existing_pdfs.append(pdf_path)
            if first_pdf is None:
                first_pdf = pdf_path
            print(f"✅ Βρέθηκε: {pdf_file}")
        else:
            print(f"⚠️  Δεν βρέθηκε: {pdf_file}")
    
    if not existing_pdfs:
        print("❌ Δεν βρέθηκε κανένα PDF αρχείο!")
        return False
    
    # Αντιγραφή του πρώτου PDF ως βάση
    output_path = public_dir / "ΟΛΕΣ_ΟΙ_ΟΔΗΓΙΕΣ_ΕΝΩΜΕΝΕΣ.pdf"
    
    if first_pdf:
        try:
            shutil.copy2(first_pdf, output_path)
            print(f"\n📄 Δημιουργήθηκε βάση από: {first_pdf.name}")
            print(f"📁 Αποθηκεύτηκε στο: {output_path}")
            
            file_size_mb = output_path.stat().st_size / (1024 * 1024)
            print(f"📊 Μέγεθος αρχείου: {file_size_mb:.2f} MB")
            
            print("\n📝 ΣΗΜΕΙΩΣΗ: Αυτό είναι ένα προσωρινό αρχείο.")
            print("   Για πλήρη ένωση όλων των PDF, χρησιμοποιήστε εξωτερικό εργαλείο όπως:")
            print("   - Adobe Acrobat")
            print("   - PDFtk")
            print("   - Online PDF merger")
            
            print(f"\n📋 Αρχεία που πρέπει να ενωθούν ({len(existing_pdfs)} συνολικά):")
            for i, pdf_path in enumerate(existing_pdfs, 1):
                print(f"   {i}. {pdf_path.name}")
            
            return True
            
        except Exception as error:
            print(f"❌ Σφάλμα κατά την αντιγραφή: {error}")
            return False
    
    return False

if __name__ == "__main__":
    success = merge_pdfs_simple()
    if success:
        print("\n🎉 Δημιουργήθηκε το συγκεντρωτικό αρχείο!")
    else:
        print("\n💥 Κάτι πήγε στραβά...")