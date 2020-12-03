/**
 * Multi-Select2.js
 *
 * Advanced multi-select control
 *
 * Based upon the Multi-Select2 library from Muhammad Abdullah <mabdullah5514@yahoo.com>
 * https://github.com/abdullah5514/multi-select2
 *
 * @authors Ron Jones <noldona@gmail.com>
 * @version 1.1.0
 * @license MIT <https://opensource.org/licenses/MIT>
 *
 * TODO: Make the control responsive
 * TODO: Fix bugs for multiple selects on single page
 */

// Allowed attributes for element creation
const allowedAttributes = {
	value: "data-value",
	disabled: "data-disabled",
	class: "class",
	type: "type",
	info: "data-info",
	action: "data-action",
	tabindex: "tabindex"
};

/**
 * MultiSelectElement
 *
 * Element wrapper clas to make working with elements easier
 */
class MultiSelectElement {
	constructor(element, attributes = {}, i18n = {}) {
		this._node = element instanceof HTMLElement ? element : document.createElement(element);
		this._config = { i18n };

		this._setAttributes(attributes);

		if (attributes.textContent) {
			this._node.textContent = attributes.textContent;
		}

		return this;
	}

	/**
	 * Get the HTMLNode for the element
	 */
	get() {
		return this._node;
	}

	/**
	 * Append a child to the element
	 */
	append(element) {
		this._node.appendChild(element);
		return this;
	}

	/**
	 * Add a class to the element
	 */
	addClass(className) {
		this._node.classList.add(className);
		return this;
	}

	/**
	 * Remove a class from the element
	 */
	removeClass(className) {
		this._node.classList.remove(className);
		return this;
	}

	/**
	 * Toggle a class on the element
	 */
	toggleClass(className) {
		this._node.classList.toggle(className);
		return this;
	}

	/**
	 * Add an event listener to the element
	 */
	addEventListener(type, callback, capturer=false) {
		this._node.addEventListener(type, callback, capturer);
		return this;
	}

	/**
	 * Remove an event listener from the element
	 */
	removeEventListener(type, callback) {
		this._node.removeEventListener(type, callback);
		return this;
	}

	/**
	 * Set the text content for the element
	 */
	setText(text) {
		this._node.textContent = text;
		return this;
	}

	/**
	 * Get the height of the element
	 */
	getHeight() {
		return window.getComputedStyle(this._node).height;
	}

	/**
	 * Set the top position of the element
	 *
	 * TODO: Change this to use responsive measurements
	 */
	setTop(top) {
		this._node.style.top = `${top}px`;
		return this;
	}

	/**
	 * Set focus on the element
	 */
	focus() {
		this._node.focus();
		return this;
	}

	/**
	 * Loop through a list of attributes and add them to the element
	 */
	_setAttributes(attributes) {
		for (const key in attributes) {
			if (allowedAttributes[key] && attributes[key]) {
				this._setAttribute(allowedAttributes[key], attributes[key]);
			}
		}
	}

	/**
	 * Set the attribute on the element
	 */
	_setAttribute(key, value) {
		this._node.setAttribute(key, value);
	}
}

class MultiSelect2 {
	constructor(element, config) {
		this._config = {...config};
		this._state = {
			opened: false,
		};
		this._icons = [];
		this.currentFocus = -1

		// Prepare event listeners for later use
		this._boundHandleClick = this._handleClick.bind(this);
		this._boundHandleKeyUp = this._handleKeyUp.bind(this);
		this._boundPreventDefaultAction = this._preventDefaultAction.bind(this);
		this._boundUnselectOption = this._unselectOption.bind(this);
		this._boundSortOptions = this._sortOptions.bind(this);

		// Get a reference to the body element
		this._body = new MultiSelectElement(document.body);

		this._create(element);
		this._setValue();
	}

	/**
	 * Create the control
	 */
	_create(_element) {
		// Get the div this control will replace
		const element = typeof _element === "string" ? document.querySelector(_element) : _element;

		// Create the various parts of the control
		this._parent = new MultiSelectElement(element);
		this._select = new MultiSelectElement("div", {class: "multi-select__select", tabindex: "0"});
		this._selected_value = new MultiSelectElement("span", {class: "multi-select__label"});
		this._optionsDiv = new MultiSelectElement("div", {class: "multi-select__options"});
		this._dropIcon = new MultiSelectElement("i", {class: "fa fa-caret-down multi-select__drop_icon"});

		// Add the parts together to create the full control
		this._select.append(this._selected_value.get());
		this._select.append(this._optionsDiv.get());
		this._select.append(this._dropIcon.get());
		this._parent.append(this._select.get());

		// Generate the list of options from the config
		this._options = this._generateOptionsOfSelect();

		// Add event listeners to the control
		this._select.addEventListener("click", this._boundHandleClick);
		this._select.addEventListener("keyup", this._boundHandleKeyUp);
		this._optionsDiv.addEventListener("keyup", this._boundHandleKeyUp, true);
		this._body.addEventListener("keydown", this._boundPreventDefaultAction);

		// Add a class if multiple items can be selected
		if (this._config.multiple) {
			this._select.addClass("multi-select__select--multiple");
		}
	}

	/**
	 * Generate the list of options that can be selected
	 */
	_generateOptionsOfSelect() {
		// If using autocomplete
		if (this._config.autocomplete) {
			this._autocomplete = new MultiSelectElement("input", {class: "multi-select__autocomplete", type: "text"});
			// Add Listeners to input field of autocomplete
			this._autocomplete.addEventListener("input", this._boundSortOptions);

			// Add autocomplete field to start of options dropdown
			this._optionsDiv.append(this._autocomplete.get());
		}

		return this._config.options.map(_option => {
			// Create the element for the option
			let classOption = "multi-select__option";
			if (_option.class) classOption += " " + _option.class;
			if (_option.groupHeader) classOption += " multi-select__option--group_header";
			const option = new MultiSelectElement("div", {
				class: classOption,
				value: _option.value,
				textContent: _option.label,
				disabled: _option.disabled,
				info: _option.info,
				action: _option.action,
				tabindex: "-1"
			});

			this._optionsDiv.append(option.get());

			return option;
		});
	}

	/**
	 * Handle click events
	 */
	_handleClick(event) {
		// Reset dropdown
		event.stopPropagation();
		this._closeAllLists();

		// If click is on the autocomplete field, don't do anything
		if (event.target.className === "multi-select__autocomplete") {
			return;
		}

		// If the dropdown is open
		if (this._state.opened) {
			// Check if an option was clicked, if so, select it
			const option = this._options.find(_option => _option.get() === event.target);
			if (option) {
				if (!option.get().dataset.disabled) {
					this._setValue(option.get().dataset.value, true);
				} else {
					return;
				}
			}

			// Close the dropdown
			this._closeDropdown();
			return;
		}

		// Check for clicking on the selected option icon for removal
		if ('fa ' + event.target.parentElement.classList[1] === this._config.icon) {
			// If the target has a fontawesome icon
			this._unselectOption(event.target.parentElement.dataset.value);
			return;
		} else if (event.target.tagName === 'I' && event.target.classList.contains(this._config.icon)) {
			// If the target is an i tag with a fontawesome class
			this._unselectOption(event.target.dataset.value);
			return;
		} else if (event.target.tagName === 'svg') {
			// If the target is an svg tag, used for fontawesome pro icons
			this._unselectOption(event.target.dataset.value);
			return;
		}

		// Open the dropdown
		this._openDropdown();
	}

	/**
	 * Handle key events
	 */
	_handleKeyUp(event) {
		event.preventDefault();
		let handled = false;  // This control handles this key
		let openKey = false;  // This key opens the options dropdown
		let closeKey = false;  // This key closes the optiosn dropdown
		let moveKey = false;  // This key moves through the options
		let topKey = false;  // This key moves to the top of the options
		let bottomKey = false;  // This key moves to the bottom of the options
		let downKey = false;  // This key moves down through the options
		let upKey = false;  // This key moves up through the options
		let selectKey = false;  // This key selects the current option
		let selectedMoveKey = false;  // This key moves through the selected options
		let leftKey = false;  // This key moves left through currently selected options
		let rightKey = false;  // This key moves right through currently selected options
		let deleteKey = false;  // This key delete the currently focused selected option

		// Figure out what key was pressed
		if (event.key !== undefined) {
			// Handle the keypress is it is Enter, Space, or Escape
			switch (event.key) {
				case "Enter":
					handled = true;
					openKey = true;
					closeKey = true;
					selectKey = true;
					break;
				case " ":
				case "Spacebar":
					handled = true;
					openKey = true;
					break;
				case "Escape":
				case "Esc":
				case "Tab":
					handled = true;
					closeKey = true;
					break;
				case "ArrowDown":
				case "Down":
					handled = true;
					moveKey = true;
					downKey = true;
					break;
				case "ArrowUp":
				case "Up":
					handled = true;
					moveKey = true;
					upKey = true;
					break;
				case "ArrowLeft":
				case "Left":
					handled = true;
					leftKey = true;
					closeKey = true;
					selectedMoveKey = true;
					break;
				case "ArrowRight":
				case "Right":
					handled = true;
					rightKey = true;
					closeKey = true;
					selectedMoveKey = true;
					break;
				case "Delete":
				case "Del":
				case "Backspace":
					handled = true;
					deleteKey = true;
					selectedMoveKey = true;
					break;
				case "Home":
				case "PageUp":
					handled = true;
					moveKey = true;
					topKey = true;
					selectedMoveKey = true;
					break;
				case "End":
				case "PageDown":
					handled = true;
					moveKey = true;
					bottomKey = true;
					selectedMoveKey = true;
					break;
				default:
					break;
			}
		// This check is for backwards compatibility and uses deprecated features
		} else if (event.keyCode !== undefined) {
			// Handle the keypress is it is Enter, Space, or Escape
			switch (event.keyCode) {
				case "Enter":
					handled = true;
					openKey = true;
					closeKey = true;
					selectKey = true;
					break;
				case "Space":
					handled = true;
					openKey = true;
					break;
				case "Escape":
				case "Tab":
					handled = true;
					closeKey = true;
					break;
				case "ArrowDown":
					handled = true;
					moveKey = true;
					downKey = true;
					break;
				case "ArrowUp":
					handled = true;
					moveKey = true;
					upKey = true;
					break;
				case "ArrowLeft":
					handled = true;
					leftKey = true;
					closeKey = true;
					selectedMoveKey = true;
					break;
				case "ArrowRight":
					handled = true;
					rightKey = true;
					closeKey = true;
					selectedMoveKey = true;
					break;
				case "Delete":
					handled = true;
					deleteKey = true;
					selectedMoveKey = true;
					break;
				case "Home":
				case "PageUp":
					handled = true;
					moveKey = true;
					topKey = true;
					break;
				case "End":
				case "PageDown":
					handled = true;
					moveKey = true;
					bottomKey = true;
					break;
				default:
					break;
			}
		}

		// If this is a key we are handling
		if (handled) {
			// Reset dropdown
			event.stopPropagation();
			this._closeAllLists();

			// If click is on the autocomplete field, don't do anything
			// if (event.target.className === "multi-select__autocomplete") {
			//  return;
			// }

			// If the dropdown is open and key pressed is a close key
			if (this._state.opened && closeKey) {
				// Check if an option had focus and a selection key was pressed, if so, select it
				const option = this._options.find(_option => _option.get() === event.target);
				if (option && selectKey) {
					if (!option.get().dataset.disabled) {
						this._setValue(option.get().dataset.value, true);
					} else {
						return;
					}
				}

				// Close the dropdown
				this._closeDropdown();
				return;
			}

			// If an open key was pressed
			if (openKey) {
				// Open the dropdown
				this._openDropdown();
			}

			// If the dropdown is open and a move key was pressed
			if (this._state.opened && moveKey) {
				if (downKey) {
					// Move to the next option
					let sibling = document.activeElement.nextSibling;
					while (sibling) {
						if (!sibling.classList.contains('multi-select__option--selected') &&
								!sibling.classList.contains('multi-select__option--hidden') &&
								!sibling.classList.contains('multi-select__option--group_header') &&
								!sibling.dataset.disabled) {
							sibling.focus();
							break;
						}
						sibling = sibling.nextSibling;
					}
				} else if (upKey) {
					// Move to the previous option
					let sibling = document.activeElement.previousSibling;
					while (sibling) {
						if (!sibling.classList.contains('multi-select__option--selected') &&
								!sibling.classList.contains('multi-select__option--hidden') &&
								!sibling.classList.contains('multi-select__option--group_header') &&
								!sibling.dataset.disabled) {
							sibling.focus();
							break;
						}
						sibling = sibling.previousSibling;
					}
				} else if (bottomKey) {
					// Move to the last option
					let sibling = this._optionsDiv.get().lastElementChild;
					while (sibling) {
						if (!sibling.classList.contains('multi-select__option--selected') &&
								!sibling.classList.contains('multi-select__option--hidden') &&
								!sibling.classList.contains('multi-select__option--group_header') &&
								!sibling.dataset.disabled) {
							sibling.focus();
							break;
						}
						sibling = sibling.previousSibling;
					}
				} else if (topKey) {
					// Move to the first option
					let sibling = this._optionsDiv.get().firstElementChild;
					while (sibling) {
						if (!sibling.classList.contains('multi-select__option--selected') &&
								!sibling.classList.contains('multi-select__option--hidden') &&
								!sibling.classList.contains('multi-select__option--group_header') &&
								!sibling.dataset.disabled) {
							sibling.focus();
							break;
						}
						sibling = sibling.nextSibling;
					}
				}
			}

			// If the dropdown is not open, or the left key or the right key was pressed
			if (this._config.multiple && ((!this._state.opened && selectedMoveKey) || leftKey || rightKey)) {
				// If focus is currently on one of the selected options
				if (this._selected_value.get().contains(document.activeElement)) {
					// Handle normal movement through selected options
					if (rightKey) {
						// Move to the next selected option
						if (document.activeElement.nextSibling) {
							document.activeElement.nextSibling.focus();
						}
					} else if (leftKey) {
						// Move to the previous selected option
						if (document.activeElement.previousSibling) {
							document.activeElement.previousSibling.focus();
						}
					} else if (bottomKey) {
						// Move to the last selected option
						this._selected_value.get().lastElementChild.focus();
					} else if (topKey) {
						// Move to the first selected option
						this._selected_value.get().firstElementChild.focus();
					} else if (deleteKey) {
						// Remove the selected option with focus
						this._unselectOption(event.target.querySelector('[data-value]').dataset.value);
					}
				// If left arrow is pressed and the drop down is open
				} else if (rightKey) {
					if (this._state.opened) {
						// Close the dropdown
						this._closeDropdown();
					}

					if (this._selected_value.get().hasChildNodes()) {
						// Select the first selected option
						this._selected_value.get().firstElementChild.focus();
					}
				// If the right arrow is pressed and the drop down is open
				} else if (leftKey) {
					if (this._state.opened) {
						// Close the dropdown
						this._closeDropdown();
					}

					if (this._selected_value.get().hasChildNodes()) {
						// Select the last selected option
						this._selected_value.get().lastElementChild.focus();
					}
				}
			}
		}
	}

	/**
	 * Open the options dropdown
	 */
	_openDropdown() {
		// Open the dropdown
		this._select.addClass("multi-select__select--opened");
		this._body.addEventListener("click", this._boundHandleClick);
		this._select.removeEventListener("click", this._boundHandleClick);
		this._body.addEventListener("keyup", this._boundHandleKeyUp, true);
		this._select.removeEventListener("keyup", this._boundHandleKeyUp);

		// Set dropdown state to true
		this._state.opened = true;

		// If using the autocomplete, set the focus to the field
		if (this._autocomplete) {
			this._autocomplete.focus();
		// Else, set the focus to the first option in the dropdown
		} else {
			this._optionsDiv.get().firstElementChild.focus();
		}
	}

	/**
	 * Close the options dropdown
	 */
	_closeDropdown() {
		// Close the dropdown
		this._select.removeClass("multi-select__select--opened");
		this._body.removeEventListener("click", this._boundHandleClick);
		this._select.addEventListener("click", this._boundHandleClick);
		this._body.addEventListener("keyup", this._boundHandleKeyUp, true);
		this._select.removeEventListener("keyup", this._boundHandleKeyUp);
		this._select.get().focus();

		// Set dropdown state to false
		this._state.opened = false;
		return;
	}

	/**
	 * Prevent weirdness from default actions
	 */
	_preventDefaultAction(event) {
		// Prevent default action from happening if focused element is part of multi-select
		if (document.activeElement == this._select.get() || this._select.get().contains(document.activeElement)) {
			if (event.key == "Tab" || event.keyCode == "Tab") {
				if (this._state.opened) {
					if (this._config.tabSelect) {
						// Select the focused option when tabbing out of the field
						const option = this._options.find(_option => _option.get() === event.target);

						if (option) {
							if (!option.get().dataset.disabled) {
								this._setValue(option.get().dataset.value, true);
							} else {
								return;
							}
						}
					}

					// Close the dropdown
					this._closeDropdown();
				}
				return;
			}
			let eventKeys = ["Enter", " ", "Spacebar", "Escape", "Esc", "ArrowDown", "Down", "ArrowUp", "Up", "ArrowLeft", "Left", "ArrowRight",
				"Right", "Delete", "Del", "Backspace", "Home", "PageUp", "End", "PageDown"];
			if ((!this._config.autocomplete || document.activeElement != this._autocomplete.get()) && eventKeys.includes(event.key)) {
				event.preventDefault();
				event.stopPropagation();
			}
		}
	}

	/**
	 * Set the value of the control
	 */
	_setValue(value, manual, unselected) {
		if (value && !unselected) {
			this._config.value = this._config.multiple ? this._config.value.concat(value) : value;
		}
		if (value && unselected) {
			this._config.value = value;
		}

		this._options.forEach(_option => {
			_option.removeClass("multi-select__option--selected");
		});

		if (this._config.multiple) {
			const options = this._config.value.map(_value => {
				const option = this._config.options.find(_option => _option.value === _value);
				const optionNode = this._options.find(
					_option => _option.get().dataset.value === option.value.toString()
				);

				optionNode.addClass("multi-select__option--selected");

				return option;
			});

			this._selectOptions(options, manual);

			return;
		}

		if (!this._config.options.length) {
			return;
		}

		const option = this._config.value ?
			this._config.options.find(_option => _option.value.toString() === this._config.value) : '';

		if (option !== '') {
			const optionNode = this._options.find(
				_option => _option.get().dataset.value === option.value.toString()
			);

			optionNode.addClass("multi-select__option--selected");
			this._selectOption(option, manual);
		}
	}

	/**
	 * Select a single option
	 */
	_selectOption(option, manual) {
		this._selectedOption = option;

		this._selected_value.setText(option.label);

		if (this._config.onChange && manual) {
			this._config.onChange(option.value);
		}
	}

	/**
	 * Select mutliple options
	 */
	_selectOptions(options, manual) {
		this._selected_value.setText("");

		this._icons = options.map(_option => {
			const selectedLabel = new MultiSelectElement("span", {
				class: "multi-select__selected-label ".concat((_option.class) ? _option.class : ''),
				textContent: _option.label,
				tabindex: "-1"
			});
			const icon = new MultiSelectElement("i", {
				class: this._config.icon,
				value: _option.value,
			});

			selectedLabel.append(icon.get());
			this._selected_value.append(selectedLabel.get());

			return icon.get();
		});

		if (manual) {
			// eslint-disable-next-line no-magic-numbers
			this._optionsDiv.setTop(Number(this._select.getHeight().split("px")[0]));
		}

		if (this._config.onChange && manual) {
			this._config.onChange(this._config.value);
		}
	}

	/**
	 * Unselect an option
	 */
	_unselectOption(event) {
		const newValue = [...this._config.value];
		let index;
		if (!event.target) {
			index = newValue.indexOf(event);
		} else {
			index = newValue.indexOf(event.target.dataset.value);
		}

		// eslint-disable-next-line no-magic-numbers
		if (index !== -1) {
			newValue.splice(index, 1);
		}

		this._setValue(newValue, true, true);
	}

	/**
	 * Sort the options
	 */
	_sortOptions(event) {
		this._options.forEach(_option => {
			if (!_option.get().textContent.toLowerCase().includes(event.target.value.toLowerCase()) &&
					!_option.get().classList.contains('multi-select__option--group_header')) {
				_option.addClass("multi-select__option--hidden");
				return;
			}
			_option.removeClass("multi-select__option--hidden");
		});
	}

	/**
	 * Close the dropdown for any other multi-select fields
	 */
	_closeAllLists() {
		let elements = document.getElementsByClassName('multi-select__select');
		for (let i = 0; i < elements.length; i++) {
			if (elements[i] !== this._select.get()) {
				if (elements[i].classList.contains('multi-select__select--opened')) {
					elements[i].classList.remove('multi-select__select--opened');
				}
			}
		}
	}
}
