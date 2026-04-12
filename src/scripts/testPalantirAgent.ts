import {
  buildPalantirInputFromIdea,
  hasPalantirConfig,
  runPalantirMarketResearch,
} from '../lib/palantir';

async function main() {
  const idea = process.argv.slice(2).join(' ').trim() || 'AI-powered smart vehicle tracking and theft prevention system';

  if (!hasPalantirConfig()) {
    console.error('❌ Missing required env vars for Palantir test:');
    console.error('   - PALANTIR_BASE_URL');
    console.error('   - PALANTIR_ONTOLOGY_RID');
    console.error('   - PALANTIR_API_LOGIC_ID');
    console.error('   - PALANTIR_TOKEN');
    process.exit(1);
  }

  const input = buildPalantirInputFromIdea(idea, {
    budget: '10000',
    location: 'Global',
    riskTolerance: 'medium',
    experience: 'intermediate',
    goToMarket: 'online',
  });

  console.log('🧪 Testing Palantir agent with input:');
  console.log(input);

  const result = await runPalantirMarketResearch(input);
  console.log('\n✅ Palantir guidance received:\n');
  console.log(result.guidance);
}

main().catch((error) => {
  console.error('\n💥 Palantir test failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
