# MultiSelect2 JavaScript component


## Usage

```javascript
// Directly include the bundled JavaScript on the webpage.
<script src="/dist/multi-select2.min.js"></script>

new MultiSelect2(element, {
  options: [
    {
        label: "Places",
        value: "",
        disabled: true,  // Disable this option
        groupHeader: true,  // This option is a header for a group of options and shouldn't be available to select
        class: "group-header group-header-a"  // Additional classes to add to the option
    },
    {
        label: 'London',
        value: 'Ln'
    },
    {
      label: 'New York',
      value: 'NY'
    }
  ],
  autocomplete: true,  // If you want to add autocomplete functionality
  multiple: true,  // If you want to add multiple values selection
  icon: "fa fa-times",  // Cross icon in-case of multiple select to remove selected values
  onChange: value => {
    console.log(value);
  }
});
```


## TODO

- [ ] Make the control responsive

## License

```MIT```