#!/bin/bash

# Copy/paste this job script into a text file and submit with:
#    sbatch hybrid.sh

#SBATCH --time=50:00:00
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=8
#SBATCH --mem=128G
#SBATCH --partition=nova
#SBATCH --job-name="FSOD"
#SBATCH --mail-user=shreyang@iastate.edu
#SBATCH --mail-type=BEGIN
#SBATCH --mail-type=END
#SBATCH --mail-type=FAIL
#SBATCH --output="sbatch-logs/hybrid-gemini"
#SBATCH --error="sbatch-logs/hybrid-gemini"

# Activate conda (adjust path if needed)
source /work/mech-ai/shreyan/miniconda3/etc/profile.d/conda.sh
conda activate /work/mech-ai/shreyan/minconda3/envs/fsod

# Change to working dir (quote paths!)
cd "/work/mech-ai-scratch/shreyang/FSOD"

# Run your Python script with arguments
python run_hybrid.py
