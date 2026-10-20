# Pre-downloaded wheels

Place pre-downloaded `.whl` files here if your build environment has a slow
or unreliable connection to PyPI. The `ai-service/Dockerfile` installs
`opencv-python-headless` from this directory when a wheel is present, and
falls back to PyPI when it is not.

To fetch the opencv wheel for a Linux container from a Windows host:

    python -m pip download \
      --only-binary=:all: \
      --platform manylinux_2_28_x86_64 \
      --python-version 311 \
      --implementation cp --abi cp311 \
      --no-deps \
      --dest ai-service/wheels \
      "opencv-python-headless>=4.6"

The files in this directory are gitignored; do not commit the wheels.
