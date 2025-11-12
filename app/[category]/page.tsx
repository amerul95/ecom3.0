import Navbar from '../components/navbar/Navbar';
import Footer from '../components/footer/Footer';
import { ItemListPage } from '../Pages/ItemListPage';

export default function CategoryPage() {
  return (
    <>
      <Navbar />
      <ItemListPage />
      <Footer />
    </>
  );
}
