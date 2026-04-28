import OptionLabView from '@/components/OptionLabView';

export const metadata = {
  title: 'Option Lab | Buy Now AI',
  description:
    'Three-layer defense Sell-Put recommender: DCF valuation floor, dealer gamma wall, and grounded LLM risk filter.',
};

export default function OptionLabPage() {
  return (
    <div className="bg-background border border-border rounded-lg shadow-sm w-full">
      <OptionLabView />
    </div>
  );
}
