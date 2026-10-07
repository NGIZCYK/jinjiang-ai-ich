param([switch]$InstallDependencies)
$ErrorActionPreference = 'Stop'
$analyticsRoot = $PSScriptRoot
$dependencyCache = Join-Path $analyticsRoot '.cache/python-deps'
if ($InstallDependencies) {
  python -m pip install --target $dependencyCache --upgrade --only-binary=:all: -r (Join-Path $analyticsRoot 'requirements.txt')
  if ($LASTEXITCODE -ne 0) { throw 'Analysis dependency installation failed.' }
}
$previousPythonPath = $env:PYTHONPATH
try {
  if (Test-Path -LiteralPath $dependencyCache) { $env:PYTHONPATH = $dependencyCache }
  python -m unittest discover -s $analyticsRoot -p 'test_*.py'
  if ($LASTEXITCODE -ne 0) { throw 'Analysis validation failed; snapshot not regenerated.' }
  python (Join-Path $analyticsRoot 'analyze.py')
  if ($LASTEXITCODE -ne 0) { throw 'Snapshot generation failed.' }
} finally { $env:PYTHONPATH = $previousPythonPath }
