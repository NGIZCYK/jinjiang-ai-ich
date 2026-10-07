import unittest
from analyze import make_sample, segment, roi_table
from roi import ASSUMPTIONS, calculate_scenario

class AnalysisRegression(unittest.TestCase):
    def test_sample_is_reproducible_and_synthetic(self):
        a, b = make_sample(), make_sample()
        self.assertTrue(a.equals(b))
        self.assertEqual(len(a), 1200)
        self.assertNotIn('email', a.columns)

    def test_segment_preserves_samples_and_stable_ids(self):
        frame, groups = segment(make_sample())
        self.assertEqual(sum(g['sampleCount'] for g in groups), len(frame))
        self.assertEqual({g['id'] for g in groups}, {'business-efficiency', 'culture-led', 'family-leisure'})

    def test_roi_is_computed_from_shared_inputs_in_cny(self):
        rows = {r['id']: r for r in roi_table()}
        for spec in ASSUMPTIONS['scenarios'][1:]:
            row = rows[spec['id']]
            self.assertEqual(row['currency'], 'CNY')
            self.assertEqual(row['periodMonths'], 12)
            self.assertEqual(row['roiPct'], calculate_scenario(spec['inputs'])['roiPct'])
        self.assertAlmostEqual(rows['themed-room-workshop']['roiPct'], 272.8)

    def test_losses_have_no_payback(self):
        inputs = dict(ASSUMPTIONS['scenarios'][2]['inputs'], fixedMonthlyCost=1_000_000)
        result = calculate_scenario(inputs)
        self.assertLess(result['monthlyContribution'], 0)
        self.assertIsNone(result['paybackMonths'])

if __name__ == '__main__':
    unittest.main()
