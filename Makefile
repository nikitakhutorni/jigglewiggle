UUID := jigglewiggle@nikitakhutorni.github.io

.PHONY: test validate schemas pack install install-enable uninstall enable disable prefs logs clean

test:
	npm test

validate:
	./scripts/validate.sh

schemas:
	glib-compile-schemas --strict extension/schemas

pack:
	./scripts/pack.sh

install:
	./scripts/install.sh

install-enable:
	./scripts/install.sh --enable

uninstall:
	./scripts/uninstall.sh

enable:
	gnome-extensions enable $(UUID)

disable:
	gnome-extensions disable $(UUID)

prefs:
	gnome-extensions prefs $(UUID)

logs:
	journalctl --user -f -o cat /usr/bin/gnome-shell

clean:
	rm -rf dist extension/schemas/gschemas.compiled
