PORT = 8000
SERVER_CMD = python -m http.server $(PORT)
URL = http://localhost:$(PORT)/
FILES = index.html game.js styles.css

# Detect OS and set the browser-opening command
ifeq ($(OS),Windows_NT)
    OPEN_CMD = start
else
    UNAME_S := $(shell uname -s)
    ifeq ($(UNAME_S),Linux)
        OPEN_CMD = xdg-open
    else
        OPEN_CMD = open
    endif
endif

# Declare phony targets
.PHONY: all server wait_server_ready browser

# Start the server and wait for it to be ready, then open the browser
all:
	@( $(MAKE) wait_server_ready browser )&
	@$(MAKE) server

# Start the server in the foreground
server:
	@$(SERVER_CMD)

# Wait until the server is ready
wait_server_ready:
	@until curl -s $(URL) > /dev/null; do sleep 0.1; done

# Open the browser
browser:
	@$(OPEN_CMD) $(URL)

# Generate a prompt with the assignment and file contents
prompt:
	@bash -c 'echo "You are a developer on a Tetris game. You have been given the following code, with the assignment:"; \
	echo "Use 4-column indentation in all code."; \
	echo "Write all the code to implement these changes. Include comments in your code."; \
	echo " "; \
	echo "These are the files you have:"; \
	echo " "; \
	for file in $(FILES); do \
		echo "$$file:"; \
		echo; \
		cat "$$file"; \
		echo; \
	done'

# Display available targets and their descriptions
help:
	@echo "Available targets:"
	@echo "  all      - Start the server and open the browser"
	@echo "  server   - Start the server in the foreground"
	@echo "  browser  - Open the browser to the game's URL"
	@echo "  prompt   - Generate a prompt with the assignment and file contents"
	@echo "  help     - Show this help message"