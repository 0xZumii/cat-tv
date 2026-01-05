#!/bin/bash
# Cat TV Test Runner
# Run this from the project root: ./test.sh

echo "🐱 Cat TV Test Suite"
echo "===================="
echo ""

# Check if Foundry is installed
if ! command -v forge &> /dev/null; then
    echo "📦 Installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash
    source ~/.bashrc
    foundryup
fi

# Go to contracts directory
cd contracts

# Install dependencies if needed
if [ ! -d "lib/openzeppelin-contracts" ]; then
    echo "📦 Installing OpenZeppelin..."
    forge install OpenZeppelin/openzeppelin-contracts --no-commit
fi

echo ""
echo "🧪 Running Contract Tests..."
echo ""

# Run tests with verbosity
forge test -vvv

echo ""
echo "✅ Tests complete!"
