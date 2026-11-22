# Installer for the LCARS skin. Use:  weectl extension install weewx-lcars-<version>.zip
import os
from weecfg.extension import ExtensionInstaller

VERSION = "0.3.0"


def loader():
    return LCARSInstaller()


def _skin_files():
    here = os.path.dirname(os.path.abspath(__file__))
    out = {}
    for root, _dirs, names in os.walk(os.path.join(here, 'skins', 'LCARS')):
        rel = os.path.relpath(root, here)
        for n in sorted(names):
            out.setdefault(rel, []).append(os.path.join(rel, n))
    return sorted(out.items())


class LCARSInstaller(ExtensionInstaller):
    def __init__(self):
        super().__init__(
            version=VERSION,
            name='lcars',
            description='LCARS-style skin (Titan.DS palette): console, radar scope and wall display.',
            author='Josh Roskos',
            config={
                'StdReport': {
                    'LCARSReport': {
                        'skin': 'LCARS',
                        'enable': 'true',
                        'HTML_ROOT': 'lcars',
                    }
                }
            },
            files=_skin_files(),
        )
