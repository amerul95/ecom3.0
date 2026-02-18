import { Megasale } from '@/components/megasale/megasale';
import { PopularProduct } from '@/components/popularproduct/PopularProduct';
import { Subscribe } from '@/components/subscribe/Subscribe';

export default function HomePage() {
  return (
    <div>
    <Megasale/>
    <PopularProduct/>
    <Subscribe/>
  </div>
  );
}

