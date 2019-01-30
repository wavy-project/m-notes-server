Parse.Cloud.define('hello', function(req, res) {
  return 'Hi';
});

Parse.Cloud.beforeSave(Parse.User, function(request, response) {
  if (!request.object.get('fullName')) {
    response.error('full name field is required');
  } else if (request.object.get('fullName').split(' ').length < 2) {
    response.error('full name must have at least two components');
  } else if (!request.object.get('email')) {
    response.error('email address field is required');
  } else if (request.object.get('email').length == 0) {
    response.error('email must be longer than zero characters');
  } else if (!request.object.get('agreedToTermsOfService')) {
    response.error('agreement to terms of service and privacy policy is required');
  } else if (!request.object.get('agreedToTermsOfServiceAt')) {
    response.error('timestamp of agreement to terms of service and privacy policy is required');
  } else {
    request.object.set('email', request.object.get('email').toLowerCase());
    response.success();
  }
});

Parse.Cloud.afterSave(Parse.User, function(request, response) {
  const { object: user, log } = request;
  log.info('Custom log -> Parse.Cloud.afterSave(Parse.User, function(request){})');

  let defaultCategoryNames = ['_archive', 'front-channel', 'back-channel', 'r', 'o', 'y', 'g', 'b', 'i', 'v', 'p'];
  const categories = [];
  for (categoryName in defaultCategoryNames) {
    const category = new Parse.Object('Category');
    category.save({
      owner: user,
      name: categoryName
    }).then(function(savedCategory) {
      categories.append(savedCategory);
    })
    .catch(log.error.bind(log)); // Category abandoned if not saved
  }
  
  const query = new Parse.Query(Parse.User);
  query.equalTo('user', user);
  return query.first({ userMasterKey: true }).then((result) => {
    result.set('categories', categories);
    return result.save(null, { userMasterKey: true }).then(function(savedCategory) {
      response.success();
    }, function(error) {
      response.error(log.error.bind(log));
    });
  }, function(error) {
    response.error(log.error.bind(log));
  });
});

/*
Parse.Cloud.beforeSave('Plan', function(request, response) {
  if (!request.object.get('plan')) {
    response.error('plan field is required');
  } else if (!request.object.get('purchasedBy')) {
    response.error('purchasedBy field is required');
  } else if (request.object.get('activated') == null) {
    response.error('activated field is required');
  } else {
    let plan = request.object.get('plan');
    if (!(plan == 'package' || plan == 'subscription')) {
      response.error('plan field must be one of (package, subscription)');
    } else if (plan == 'package' && !request.object.get('package')) {
      response.error('package field is required for package plan');
    } else if (plan == 'package' && !packages.includes(request.object.get('package'))) {
      response.error('package field must be one of (' + packages.toString + ')');
    }
    // Plan object is well formatted
    if (plan == 'package') {
      switch (request.object.get('package')) {
        case 'dark6':
        case 'bright6':
          request.object.set('coffeesRemaining', 6);
          break;
        case 'dark9':
        case 'bright9':
          request.object.set('coffeesRemaining', 9);
          break;
        case 'dark12':
        case 'bright12':
          request.object.set('coffeesRemaining', 12);
          break;
      }
    }
    request.object.set('coffeesRedeemed', []);
    response.success();
  }
});
*/
