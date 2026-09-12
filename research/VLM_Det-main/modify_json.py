import json
import sys

def add_global(data):
    # Detect per-threshold __overall__ or simple Overall format
    datasets = [k for k in data.keys() if k != 'GLOBAL']

    # Check first dataset structure
    sample = data[datasets[0]]
    if '__overall__' in sample:
        # Thresholded format
        thresholds = sample['__overall__'].keys()
        global_metrics = {}
        for thr in thresholds:
            sums = {}
            count = 0
            for ds in datasets:
                ds_over = data[ds].get('__overall__', {})
                if thr in ds_over:
                    for m, v in ds_over[thr].items():
                        sums[m] = sums.get(m, 0.0) + v
                    count += 1
            if count > 0:
                global_metrics[thr] = {m: sums[m] / count for m in sums}
        data['GLOBAL'] = {'__overall__': global_metrics}
    elif 'Overall' in sample:
        # Simple Overall format
        sums = {}
        count = 0
        for ds in datasets:
            over = data[ds].get('Overall')
            if over:
                for m, v in over.items():
                    sums[m] = sums.get(m, 0.0) + v
                count += 1
        if count > 0:
            avg = {m: sums[m] / count for m in sums}
            data['GLOBAL'] = {'Overall': avg}
    else:
        raise ValueError('Unrecognized format: no __overall__ or Overall key')
    return data

if __name__ == '__main__':
    input_path = "/work/mech-ai-scratch/shreyang/FSOD/results/exp1_owlvit/stat.json"
    output_path = "/work/mech-ai-scratch/shreyang/FSOD/results/exp1_owlvit/stat_2.json"

    with open(input_path, 'r') as f:
        data = json.load(f)
    result = add_global(data)
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2)
    print(f"Wrote updated JSON with GLOBAL to {output_path}")
