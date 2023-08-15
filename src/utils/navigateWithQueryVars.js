export const navigateWithQueryVars = (navigate, path) => {
    const currentParams = new URLSearchParams(window.location.search);
    const vid = currentParams.get('vid');
    const queryParams = new URLSearchParams();
    queryParams.set('vid', vid);
  
    navigate({
      pathname: path,
      search: queryParams.toString()
    }, {replace: true})
  };